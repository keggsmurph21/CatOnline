<!DOCTYPE html>
<html>
<head>
  <title>test</title>
  <link rel="stylesheet" href="<?= get_layout_file('svg-style.css') ?>">
</head>

<body>

  <?
  function cube_to_axial( $cube ) {
    $q = $cube[0]; // "x"
    $r = $cubz[1]; // "z"
    return array( $q, $r );
  }

  function axial_to_cube( $hex ) {
    $x = $hex[0]; // "q"
    $z = $hex[1]; // "r"
    $y = -$x-$z;
    return array( $x, $y, $z );
  }

  function hex_anchor_to_point_str( $hexanchor, $type, $height=1 ) {
    $_x = $height;
    $_y = $height * sqrt(3)/2;
     // (-3, 1)
    $hx = $hexanchor[0];
    $hy = $hexanchor[1];
    if ($type === 'polygon') {
      $arr = array( $hx*$_x, $hy*$_y, ($hx+1)*$_x, ($hy-1)*$_y,  ($hx+2)*$_x, $hy*$_y, ($hx+2)*$_x, $hy*$_y+$_x, ($hx+1)*$_x, ($hy+1)*$_y+$_x, $hx*$_x, $hy*$_y+$_x );
      $str = "";
      foreach ($arr as $key=>$val) {
        $str .= $val . " ";
      }
      return $str;
    } else {
      return array(($hx+1)*$_x, ($hy+1)*$_y);
    }
  }

  function hex_anchor_to_text_point_str( $hexanchor, $height=1 ) {

  }

  $json = file_get_contents( "../dictionaries/futuna_aniwa/svg-data.json" );
  $json = json_decode( $json, true );
  ?>


  <svg id="gameboard" xmlns="http://www.w3.org/2000/svg" viewBox="-10 -5 30 30">
    <defs>
      <polygon id="_tile" points="0 0 0 1 <?= sqrt(3)/2 ?> 1.5 <?= sqrt(3) ?> 1 <?= sqrt(3) ?> 0 <?= sqrt(3)/2 ?> -0.5" style="fill:red; stroke:white; stroke-width:0.1;" />
    </defs>

    <rect style="fill: blue;" x="-10" y="-5" width="40" height="35" />
    <?
    $hexanchors = array(
      array(-3,1), array(-1,1), array( 1,1),
      array(-4,3), array(-2,3), array( 0,3), array(2,3),
      array(-5,5), array(-3,5), array(-1,5), array(1,5), array(3,5),
      array(-4,7), array(-2,7), array( 0,7), array(2,7),
      array(-3,9), array(-1,9), array( 1,9) );

    $hexes = $json['other']['hexes'];
    foreach ( $hexes as $n=>$hex ) {
      $textpts = hex_anchor_to_point_str( array($hex['x'], $hex['y']), 'text' ); ?>
        <g class="tile-group" id="<?= $n ?>">
          <polygon class="tile-polygon <?= $hex['resource'] ?>" id="<?= $n ?>" points="<?= hex_anchor_to_point_str( array($hex['x'], $hex['y']), 'polygon' ) ?>" />
          <text class="tile-text <?= ($hex['num'] === 6 || $hex['num'] === 8) ? 'red' : '' ?>" text-anchor="middle" x="<?= $textpts[0] ?>" y="<?= $textpts[1] ?>">
            <?= $hex['num'] ? $hex['num'] : '' ?>
          </text>
        </g>
      <?
    }/*

    $locs = array(
                  array(sqrt(3),sqrt(3)/2), array(2*sqrt(3),sqrt(3)/2), array(3*sqrt(3),sqrt(3)/2),
            array(sqrt(3)/2,1.5+sqrt(3)/2), array(3*sqrt(3)/2,1.5+sqrt(3)/2), array(5*sqrt(3)/2,1.5+sqrt(3)/2), array(7*sqrt(3)/2,1.5+sqrt(3)/2),
      array(0,3.0+sqrt(3)/2), array(sqrt(3),3.0+sqrt(3)/2), array(2*sqrt(3),3.0+sqrt(3)/2), array(3*sqrt(3),3.0+sqrt(3)/2), array(4*sqrt(3),3.0+sqrt(3)/2),
            array(sqrt(3)/2,4.5+sqrt(3)/2), array(3*sqrt(3)/2,4.5+sqrt(3)/2), array(5*sqrt(3)/2,4.5+sqrt(3)/2), array(7*sqrt(3)/2,4.5+sqrt(3)/2),
                  array(sqrt(3),6.0+sqrt(3)/2), array(2*sqrt(3),6.0+sqrt(3)/2), array(3*sqrt(3),6.0+sqrt(3)/2),
    );
    foreach ( $locs as $n => $coords ) { ?>
      <use xlink:href="#_tile" id="<?= $n ?>" class="tile" x="<?= $coords[0] ?>" y="<?= $coords[1] ?>" />
    <?
  }*/
    ?>
  </svg>

  <p style="display:none">
    <?= var_dump($json['other']['hexes']); ?>
  </p>

 <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>
 <script>

    $(document).ready(function() {
      var tiles = $('.tile-group');
      tiles.each( function(i) {
        $(this).click(function() {
          console.log( 'you clicked tile ' + this.id );
        });
      });
      console.log(tiles);
    });

  </script>
</body>
